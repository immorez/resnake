import { useCallback, useReducer, useEffect, useState } from "react";
import { EAST, INIT_STATE, NORTH, SOUTH, WEST } from "../initialState.js";
import { random_food } from "../logic.js";

function useKeyPress(targetKey) {
  // State for keeping track of whether key is pressed
  const [keyPressed, setKeyPressed] = useState(false);
  // If pressed key is our target key then set to true
  const downHandler = useCallback(
    ({ key }) => {
      if (key === targetKey) {
        setKeyPressed(true);
      }
    },
    [targetKey]
  );
  // If released key is our target key then set to false
  const upHandler = useCallback(
    ({ key }) => {
      if (key === targetKey) {
        setKeyPressed(false);
      }
    },
    [targetKey]
  );
  // Add event listeners
  useEffect(() => {
    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  }, [downHandler, upHandler]); // Empty array ensures that effect is only run on mount and unmount
  return keyPressed;
}

export default function useSnake() {
  const [currentDirection, setCurrentDirection] = useState();

  const wPress = useKeyPress("w");
  const sPress = useKeyPress("s");
  const aPress = useKeyPress("a");
  const dPress = useKeyPress("d");

  const snakeRedcuer = (state, action) => {
    switch (action.type) {
      case "MOVE":
        const snake = state.snake;
        let coords = { x: snake[0].x, y: snake[0].y };

        if (snake[0].x < 0) {
          coords = { x: state.cols - 1, y: snake[0].y };
        } else if (snake[0].x >= state.cols) {
          coords = { x: 0, y: snake[0].y };
        } else if (snake[0].y < 0) {
          coords = { x: snake[0].x, y: state.rows - 1 };
        } else if (snake[0].y >= state.rows) {
          coords = { x: snake[0].x, y: 0 };
        } else {
          coords = {
            x: state.snake[0].x + action.direction.x,
            y: state.snake[0].y + action.direction.y,
          };
        }

        snake.unshift(coords);

        let end = false;
        for (let i = 3; i < snake.length; i++) {
          const has_collided =
            snake[i].x === snake[0].x && snake[i].y === snake[0].y;
          if (has_collided) end = true;
        }
        if (end) {
          setCurrentDirection(undefined);
          return {
            ...state,
            moves: [EAST],
            snake: [{ x: 2, y: 2 }],
            apple: { x: 16, y: 2 },
          };
        }

        return {
          ...state,
          moves: [...state.moves, action.direction],
          snake: snake,
        };

      case "EAT":
        let apple_x = state.apple.x;
        let apple_y = state.apple.y;

        const hasEatenFood =
          state.snake[0].x === apple_x && state.snake[0].y === apple_y;

        if (hasEatenFood) {
          const apple_x = random_food(0, state.cols - 1);
          const apple_y = random_food(0, state.rows - 1);
          console.log(apple_x, apple_y);
          return {
            ...state,
            apple: { x: apple_x, y: apple_y },
          };
        } else if (state.snake.length > 1) {
          const snake = state.snake;
          snake.pop();
          return {
            ...state,
            snake: snake,
          };
        }

        return state;

      case "END_GAME":
        return INIT_STATE;
      default:
        break;
    }
  };

  const [state, dispatch] = useReducer(snakeRedcuer, INIT_STATE);

  const moveSnakeHandler = useCallback(() => {
    switch (true) {
      case wPress:
        if (currentDirection !== NORTH && currentDirection !== SOUTH)
          setCurrentDirection(NORTH);
        break;
      case sPress:
        if (currentDirection !== SOUTH && currentDirection !== NORTH)
          setCurrentDirection(SOUTH);
        break;
      case aPress:
        if (currentDirection !== WEST && currentDirection !== EAST)
          setCurrentDirection(WEST);
        break;
      case dPress:
        if (currentDirection !== WEST && currentDirection !== EAST)
          setCurrentDirection(EAST);
        break;
      default:
        break;
    }
  }, [aPress, currentDirection, dPress, sPress, wPress]);

  useEffect(() => moveSnakeHandler(), [moveSnakeHandler]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentDirection) {
        dispatch({ type: "MOVE", direction: currentDirection });
        dispatch({ type: "EAT" });
      }
    }, state.speed);

    return () => clearInterval(interval);
  }, [currentDirection, state.moves, state.speed]);

  useEffect(() => {}, [state.snake]);

  return state;
}
